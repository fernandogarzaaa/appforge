import AIAssistant from './pages/AIAssistant';
import APIExplorer from './pages/APIExplorer';
import BotBuilder from './pages/BotBuilder';
import CodePlayground from './pages/CodePlayground';
import Components from './pages/Components';
import ContractBuilder from './pages/ContractBuilder';
import DAOGovernance from './pages/DAOGovernance';
import Dashboard from './pages/Dashboard';
import DeFiHub from './pages/DeFiHub';
import EntityDesigner from './pages/EntityDesigner';
import GitHubConnect from './pages/GitHubConnect';
import Guide from './pages/Guide';
import NFTStudio from './pages/NFTStudio';
import PageEditor from './pages/PageEditor';
import Pricing from './pages/Pricing';
import ProjectSettings from './pages/ProjectSettings';
import ProjectTasks from './pages/ProjectTasks';
import Projects from './pages/Projects';
import SocialMediaHub from './pages/SocialMediaHub';
import TokenCreator from './pages/TokenCreator';
import VSCodeIntegration from './pages/VSCodeIntegration';
import Web3Dashboard from './pages/Web3Dashboard';
import Landing from './pages/Landing';
import Profile from './pages/Profile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAssistant": AIAssistant,
    "APIExplorer": APIExplorer,
    "BotBuilder": BotBuilder,
    "CodePlayground": CodePlayground,
    "Components": Components,
    "ContractBuilder": ContractBuilder,
    "DAOGovernance": DAOGovernance,
    "Dashboard": Dashboard,
    "DeFiHub": DeFiHub,
    "EntityDesigner": EntityDesigner,
    "GitHubConnect": GitHubConnect,
    "Guide": Guide,
    "NFTStudio": NFTStudio,
    "PageEditor": PageEditor,
    "Pricing": Pricing,
    "ProjectSettings": ProjectSettings,
    "ProjectTasks": ProjectTasks,
    "Projects": Projects,
    "SocialMediaHub": SocialMediaHub,
    "TokenCreator": TokenCreator,
    "VSCodeIntegration": VSCodeIntegration,
    "Web3Dashboard": Web3Dashboard,
    "Landing": Landing,
    "Profile": Profile,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};