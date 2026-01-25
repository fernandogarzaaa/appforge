import AIAssistant from './pages/AIAssistant';
import Components from './pages/Components';
import ContractBuilder from './pages/ContractBuilder';
import Dashboard from './pages/Dashboard';
import EntityDesigner from './pages/EntityDesigner';
import NFTStudio from './pages/NFTStudio';
import PageEditor from './pages/PageEditor';
import Pricing from './pages/Pricing';
import ProjectSettings from './pages/ProjectSettings';
import Projects from './pages/Projects';
import TokenCreator from './pages/TokenCreator';
import Web3Dashboard from './pages/Web3Dashboard';
import CodePlayground from './pages/CodePlayground';
import ProjectTasks from './pages/ProjectTasks';
import DeFiHub from './pages/DeFiHub';
import DAOGovernance from './pages/DAOGovernance';
import BotBuilder from './pages/BotBuilder';
import APIExplorer from './pages/APIExplorer';
import GitHubConnect from './pages/GitHubConnect';
import SocialMediaHub from './pages/SocialMediaHub';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAssistant": AIAssistant,
    "Components": Components,
    "ContractBuilder": ContractBuilder,
    "Dashboard": Dashboard,
    "EntityDesigner": EntityDesigner,
    "NFTStudio": NFTStudio,
    "PageEditor": PageEditor,
    "Pricing": Pricing,
    "ProjectSettings": ProjectSettings,
    "Projects": Projects,
    "TokenCreator": TokenCreator,
    "Web3Dashboard": Web3Dashboard,
    "CodePlayground": CodePlayground,
    "ProjectTasks": ProjectTasks,
    "DeFiHub": DeFiHub,
    "DAOGovernance": DAOGovernance,
    "BotBuilder": BotBuilder,
    "APIExplorer": APIExplorer,
    "GitHubConnect": GitHubConnect,
    "SocialMediaHub": SocialMediaHub,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};