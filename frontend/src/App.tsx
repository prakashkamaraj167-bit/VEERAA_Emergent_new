import { Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import CartPage from "@/pages/CartPage";
import Checkout from "@/pages/Checkout";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import MyOrders from "@/pages/MyOrders";
import Account from "@/pages/Account";
import TrackOrder from "@/pages/TrackOrder";
import Exchange from "@/pages/Exchange";
import Admin from "@/pages/Admin";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/account" element={<Account />} />
        <Route path="/track" element={<TrackOrder />} />
        <Route path="/exchange" element={<Exchange />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Layout>
  );
}
