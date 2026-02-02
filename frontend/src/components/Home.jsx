import React, { useContext } from "react";
import "./Home.css";
import { IoWalletOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
// in Mobiles.jsx & Home.jsx
import { StockContext } from "./StockContext";


function Home({ sidebarWidth = 64 }) {
  const navigate = useNavigate();
  const { totalMobiles, totalAccessories } = useContext(StockContext);

  return (
    <div className="home-shell" style={{ ["--sidebar-w"]: `${sidebarWidth}px` }}>
      <main className="home-body">
        <div className="home-container">
          <section className="summary-box">
            <header className="summary-title">Summary</header>

            <div className="summary-body">
              <div className="cards">

                <article className="card card-clickable" onClick={() => navigate("/mobiles")}>
                  <div className="card-icon"><IoWalletOutline size={24} /></div>
                  <div className="card-title">Total Mobiles</div>
                  <div className="card-value card-value-dark">{totalMobiles}</div>
                </article>

                <article className="card card-clickable" onClick={() => navigate("/accessories")}>
                  <div className="card-icon"><IoWalletOutline size={24} /></div>
                  <div className="card-title">Total Accessories</div>
                  <div className="card-value card-value-dark">{totalAccessories}</div>
                </article>

              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Home;
