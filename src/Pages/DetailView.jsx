import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './DetailView.css';
import { Link } from 'react-router-dom';


function DetailView({ location }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const ref = doc(db, `locations/${location}/products`, id);
        const snap = await getDoc(ref);
        if (snap.exists()) setProduct({ id: snap.id, ...snap.data() });
        else setProduct(null);
      } catch (e) {
        console.error(e);
        setProduct(null);
      }
    }
    if (location && id) fetchProduct();
  }, [id, location]);

  if (!product) return <div className="detail-loading">
    <Link to="/" className="back-to-catalog">В каталог тваров
  </Link></div>;

 return (
    <div className="detail-page no-header">
      <div className="back-to-catalog-wrap">
        <Link to="/" className="back-to-catalog">
          Вернуться в каталог
        </Link>
      </div>
      <div className="detail-view">
        {product.photo && (
          <div className="detail-photo-wrap">
            <img src={product.photo} alt={product.name} className="detail-photo" />
          </div>
        )}
        <h2 className="detail-title">{product.name}</h2>
        <div className="detail-price">{product.price} ₽</div>
        <div className="detail-desc">{product.desc}</div>
      </div>
    </div>
  );

}

export default DetailView;