import { useParams } from 'react-router-dom';
import './DetailView.css';

function DetailView() {
  const { id } = useParams();

  return (
    <div>
      <h1>Detail {id}</h1>
    </div>
  );
}

export default DetailView;
