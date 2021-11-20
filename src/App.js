import { React, useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import Product from "./Product";

function App() {
  const [products, setProducts] = useState([]);
  const [email, setEmail] = useState();
  const [valid, setValid] = useState({ valid: false, listIds: [] });

  useEffect(() => {
    axios
      .get("/items")
      .then((response) => {
        setProducts(response.data);
      })
      .catch((e) => {
        console.log(e);
      });
  }, []);

  async function submitForm(e) {
    e.preventDefault();
    try {
      const response = await axios.post("/download-item", { email });
      if (response.data.valid === false) return alert("Email invalid");
      setValid(response.data);
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <>
      <h1 className="title">Store</h1>
      <form className="sign-in-form" onSubmit={(e) => submitForm(e)}>
        <div className="sign-in-helper-text">
          Already purchased? Enter your email to get download links.
        </div>
        <div className="form-input">
          <input
            type="email"
            placeholder="Email"
            className="input"
            required
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn btn-login">Login</button>
        </div>
      </form>
      <div className="item-list">
        {products.map((item) => (
          <Product key={item.id} item={item} valid={valid} />
        ))}
      </div>
      ;
    </>
  );
}

export default App;
