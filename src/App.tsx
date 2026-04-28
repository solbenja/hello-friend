import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Blocks from "./pages/Blocks";
import Transactions from "./pages/Transactions";
import Network from "./pages/Network";
import Uptime from "./pages/Uptime";
import Swap from "./pages/Swap";
import Pool from "./pages/Pool";
import Terminal from "./pages/Terminal";
import Ecosystem from "./pages/Ecosystem";
import Parameters from "./pages/Parameters";
import Deploy from "./pages/Deploy";
import Forge from "./pages/Forge";
import WorldMap from "./pages/litland/WorldMap";
import MyPlot from "./pages/litland/MyPlot";
import Marketplace from "./pages/litland/Marketplace";
import NFTs from "./pages/litland/NFTs";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/blocks" element={<Blocks />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/network" element={<Network />} />
          <Route path="/uptime" element={<Uptime />} />
          <Route path="/swap" element={<Swap />} />
          <Route path="/pool" element={<Pool />} />
          <Route path="/terminal" element={<Terminal />} />
          <Route path="/ecosystem" element={<Ecosystem />} />
          <Route path="/parameters" element={<Parameters />} />
          <Route path="/deploy" element={<Deploy />} />
          <Route path="/forge" element={<Forge />} />
          <Route path="/litland" element={<WorldMap />} />
          <Route path="/litland/my-plot" element={<MyPlot />} />
          <Route path="/litland/marketplace" element={<Marketplace />} />
          <Route path="/litland/nfts" element={<NFTs />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
