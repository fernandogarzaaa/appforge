import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import EntityDesigner from './pages/EntityDesigner';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Projects": Projects,
    "EntityDesigner": EntityDesigner,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};