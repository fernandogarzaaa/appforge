import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import EntityDesigner from './pages/EntityDesigner';
import PageEditor from './pages/PageEditor';
import Components from './pages/Components';
import AIAssistant from './pages/AIAssistant';
import ProjectSettings from './pages/ProjectSettings';
import Web3Dashboard from './pages/Web3Dashboard';
import TokenCreator from './pages/TokenCreator';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Projects": Projects,
    "EntityDesigner": EntityDesigner,
    "PageEditor": PageEditor,
    "Components": Components,
    "AIAssistant": AIAssistant,
    "ProjectSettings": ProjectSettings,
    "Web3Dashboard": Web3Dashboard,
    "TokenCreator": TokenCreator,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};