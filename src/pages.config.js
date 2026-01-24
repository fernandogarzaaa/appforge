import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import EntityDesigner from './pages/EntityDesigner';
import PageEditor from './pages/PageEditor';
import Components from './pages/Components';
import AIAssistant from './pages/AIAssistant';
import ProjectSettings from './pages/ProjectSettings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Projects": Projects,
    "EntityDesigner": EntityDesigner,
    "PageEditor": PageEditor,
    "Components": Components,
    "AIAssistant": AIAssistant,
    "ProjectSettings": ProjectSettings,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};