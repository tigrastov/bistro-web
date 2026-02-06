import { useState, useEffect } from "react";
import Select from "react-select";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { locationNames } from "./locationNames"; // ← импортируем словарь
import "./DeliveryForm.css";

export default function DeliveryForm({ onChange, location }) {
    const [phone, setPhone] = useState("");
    const [city, setCity] = useState(""); // ← сюда будем подставлять короткое имя
    const [street, setStreet] = useState("");
    const [streetOptions, setStreetOptions] = useState([]);
    const [house, setHouse] = useState("");
    const [apartment, setApartment] = useState("");
    const [entrance, setEntrance] = useState("");
    const [floor, setFloor] = useState("");
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (location) {
            // Определяем короткое имя населённого пункта
            let displayCity = "";
            if (location === "Kubenskoye-Lenina-Street") displayCity = "с. Кубенское(Песочное)";
            if (location === "Vologda-Karla-Marksa-Street") displayCity = "г. Вологда";
            if (location === "Vologda-Fryazinovskaya-Street") displayCity = "г. Вологда";
            setCity(displayCity);
            onChange?.((prev) => ({ ...prev, city: displayCity }));
        }
    }, [location]);

    // --- Валидация ---
    const validate = () => {
        const newErrors = {};

        // Проверяем телефон по шаблону +79xxxxxxxxx
        const phoneRegex = /^\+7\d{10}$/;
        if (!phone.trim()) newErrors.phone = "Телефон обязателен";
        else if (!phoneRegex.test(phone.trim()))
            newErrors.phone = "Введите корректный номер (+79XXXXXXXXX)";

        if (!city.trim()) newErrors.city = "Населённый пункт обязателен";
        if (!street.trim()) newErrors.street = "Улица обязательна";
        if (!house.trim()) newErrors.house = "Дом обязателен";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePhoneChange = (e) => {
        let value = e.target.value.replace(/[^\d+]/g, "");
        if (!value.startsWith("+7")) {
            value = "+7" + value.replace(/^\+?7?/, "");
        }
        setPhone(value);
    };

    useEffect(() => {
        const loadStreets = async () => {
            if (!location) return;

            try {
                const locRef = doc(db, "locations", location);
                const snap = await getDoc(locRef);
                const streets = snap.data()?.streets || [];

                const options = streets.map(street => ({
                    value: street,
                    label: street
                }));
                setStreetOptions(options);
            } catch (error) {
                console.error("Ошибка загрузки улиц:", error);
            }
        };

        loadStreets();
    }, [location]);




    // --- Передача данных родителю ---
    const handleBlur = () => {
        if (validate()) {
            onChange?.({
                phone,
                city,
                street,
                house,
                apartment,
                entrance,
                floor,
            });
        }
    };

    return (
        <div className="delivery-form">
            <div>
                <label>Телефон*</label>
                <input
                    type="text"
                    placeholder="+79XXXXXXXXX"
                    value={phone}
                    onChange={handlePhoneChange}

                    onBlur={handleBlur}
                />
                {errors.phone && <span className="error">{errors.phone}</span>}
            </div>

            <div>
                <label>Населённый пункт*</label>
                <input
                    type="text"
                    value={city}
                    readOnly
                    className="readonly"
                />
            </div>

            <div>
                <label>Улица*</label>
                <Select
                    options={streetOptions}
                    value={streetOptions.find(opt => opt.value === street)}
                    onChange={(selectedOption) => {
                        setStreet(selectedOption?.value || "");
                    }}
                    onBlur={handleBlur}
                    placeholder="Выберите улицу..."
                    isSearchable
                    noOptionsMessage={() => "Улица не найдена"}
                    className="street-select"
                    classNamePrefix="select"
                    // Добавьте эти пропсы:
                    styles={{
                        menu: (provided) => ({
                            ...provided,
                            maxHeight: '200px',     // Фиксируем высоту
                            overflowY: 'auto',      // Включаем скролл
                            zIndex: 1000            // Поверх других элементов
                        }),
                        control: (provided) => ({
                            ...provided,
                            minHeight: '40px',      // Фиксированная высота
                            height: '40px'
                        })
                    }}
                    menuPlacement="auto"            // Умное позиционирование
                />
                {errors.street && <span className="error">{errors.street}</span>}
            </div>

            <div>
                <label>Дом*</label>
                <input
                    type="text"
                    value={house}
                    onChange={(e) => setHouse(e.target.value)}
                    onBlur={handleBlur}
                />
                {errors.house && <span className="error">{errors.house}</span>}
            </div>

            <div>
                <label>Квартира</label>
                <input
                    type="text"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    onBlur={handleBlur}
                />
            </div>

            <div>
                <label>Подъезд</label>
                <input
                    type="text"
                    value={entrance}
                    onChange={(e) => setEntrance(e.target.value)}
                    onBlur={handleBlur}
                />
            </div>

            <div>
                <label>Этаж</label>
                <input
                    type="text"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    onBlur={handleBlur}
                />
            </div>
        </div>
    );
}
