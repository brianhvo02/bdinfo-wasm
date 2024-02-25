import './Header.scss';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectBluray } from '../store/bluray';
import { Link } from '@mui/material';

const Header = () => {
    const navigate = useNavigate();
    const headerRef = useRef<HTMLElement>(null);
    const { discInfo } = useAppSelector(selectBluray);

    return (
        <header ref={headerRef}>
            <div className='logo' onClick={() => navigate('/')}>
                <img src='/logo512.png' alt='nigiri logo' />
                <h1>bdinfo</h1>
            </div>
            { discInfo &&
            <nav>
                <Link href='/' underline='hover'>Disc Info/Movie Objects</Link>
                <Link href='/playlists' underline='hover'>Playlists</Link>
                <Link href='/clips' underline='hover'>Clips</Link>
                <Link href='/menus' underline='hover'>Menus</Link>
            </nav>
            }
        </header>
    );
}

export default Header;