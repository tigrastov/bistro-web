import './AdminPanel.css'

import { NavLink } from 'react-router-dom';

function AdminPanel (){

return (
    <div className="admin-panel">
       <NavLink to="/admin/add-product" className="admin-add-btn">
        Добавить товар
      </NavLink>
        <h1>AdminPanel</h1>     
        </div>
  );


}

export default AdminPanel;