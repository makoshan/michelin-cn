import { Navigate, Routes, Route } from "react-router-dom";
import { TRPCProvider } from "@/providers/trpc";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Discovery from "@/pages/Discovery";
import CityView from "@/pages/CityView";
import RestaurantDetail from "@/pages/RestaurantDetail";
import Favorites from "@/pages/Favorites";
import AIAdvisor from "@/pages/AIAdvisor";
import Login from "@/pages/Login";
import MapPage from "@/pages/MapPage";

export default function App() {
  return (
    <TRPCProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/map" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/discover" element={<Discovery />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/city/:city" element={<CityView />} />
          <Route path="/restaurant/:id" element={<RestaurantDetail />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/ai" element={<AIAdvisor />} />
        </Route>
      </Routes>
    </TRPCProvider>
  );
}
