
import './Info.css'
function Info (){

return (
    <div className="info">
        <div className='info-div'>
        <p>ИП Швецов Андрей Николаевич</p> 
        <p>ИНН: 352534563148</p>
        <p>Телефон: +7 (953) 505-75-00</p>
        <h3>Информвция о доставке</h3>
         <div className='delivery-price-info'>
                <p className='price-info'>Стоимость доставки:</p>
                <p> от 299 до 599 ₽ - 209 ₽</p>
                <p> от 600 до 899 ₽ - 159 ₽</p>
                <p> от 900 до 1099 ₽ - 109 ₽</p>
                <p> от 1100 до 1399 ₽ - 69 ₽</p>
                <p> от 1400 ₽ - Бесплатно ₽</p>
              </div>

        <p>Также вы можете
          ослеживать степень готовности заказов по их статусам в разделе "Мои заказы" 
          Адреса заказов (как с доставкой так и с самовывозом) должны соответствовать выбранной вами локации магазина. Адреса наших
          магазинов указаны ниже
        </p>
       </div>
       



<div className='location-wrapper'>

<div className='place-container'>
  <div className="location-info">
    <p>г. Вологда</p>
    <p>улица Карла Маркса, дом 17</p>
  </div>
  
  <div className="map-container">
    {/* Статичное превью карты */}
    <a 
      href="https://yandex.ru/maps/?text=Вологда, Карла Маркса 17" 
      target="_blank" 
      rel="noopener noreferrer"
    >
      <img 
        src="https://static-maps.yandex.ru/1.x/?lang=ru_RU&ll=39.8922,59.2187&z=16&l=map&pt=39.8922,59.2187,pm2rdl" 
        alt="Карта расположения"
        className="map-image"
      />
    </a>
    
    {/* Кнопки для навигации */}
    <div className="map-buttons">
      <a
        href="https://yandex.ru/maps/?text=Вологда, Карла Маркса 17"
        target="_blank"
        rel="noopener noreferrer"
        className="map-button yandex"
      >
        Яндекс.Карты
      </a>
      <a
        href="https://www.google.com/maps/search/Вологда, Карла Маркса 17"
        target="_blank"
        rel="noopener noreferrer"
        className="map-button google"
      >
        Google Maps
      </a>
    </div>
  </div>
</div>

<div className='place-container'>
  <div className="location-info">
    <p>Вологодский муниципальный округ, село Кубенское, улица Ленина,77а</p>
    
  </div>
  
  <div className="map-container">
    {/* Статичное превью карты */}
    <a 
      href="https://yandex.ru/maps/?ll=39.667359,59.435900&z=18&pt=39.666573,59.436132,pm2rdl" 
      target="_blank" 
      rel="noopener noreferrer"
    >
      <img 
        src="https://static-maps.yandex.ru/1.x/?lang=ru_RU&ll=39.667359,59.435900&z=17&l=map&pt=39.666573,59.436132,pm2rdl" 
        alt="Карта расположения"
        className="map-image"
      />
    </a>
    
    {/* Кнопки для навигации */}
    <div className="map-buttons">
      <a
        href="https://yandex.ru/maps/?ll=39.667359,59.435900&z=18&pt=39.666573,59.436132,pm2rdl"
        target="_blank"
        rel="noopener noreferrer"
        className="map-button yandex"
      >
        Яндекс.Карты
      </a>
      <a
        href="https://www.google.com/maps?q=59.436132,39.666573"
        target="_blank"
        rel="noopener noreferrer"
        className="map-button google"
      >
        Google Maps
      </a>
    </div>
  </div>
</div>




</div>


       





        </div>
  );


}

export default Info;
