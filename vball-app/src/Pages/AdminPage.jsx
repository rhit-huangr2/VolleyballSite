import { useNavigate } from 'react-router-dom';
import AdminMenu from '../Components/AdminMenu';

function AdminPage() {
    const navigate = useNavigate();

    return (
        <div className="AdminPage">
            <button
                type="button"
                className="BackToLists-button view-toggle-button active"
                onClick={() => navigate('/')}
            >
                Back to Player Lists
            </button>

            <AdminMenu />
        </div>
    );
}

export default AdminPage;