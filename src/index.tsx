import React from 'react';
import ReactDOM from 'react-dom/client';
import './reset.scss';
import './index.scss';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { Provider } from 'react-redux';
import store from './store';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

const theme = createTheme({
    palette: {
        primary: {
            main: '#ff5957'
        }
    }
})

root.render(
    <React.StrictMode>
        <BrowserRouter>
            <Provider store={store}>
                <ThemeProvider theme={theme}>
                    <App />
                </ThemeProvider>
            </Provider>
        </BrowserRouter>
    </React.StrictMode>
);