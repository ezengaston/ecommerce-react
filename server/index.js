require("dotenv").config();
const express = require("express");
const app = express();
const port = 1234;
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);
const cors = require("cors");
const axios = require("axios");

const items = require("./items.json");

app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
  })
);

app.get("/items", (req, res) => {
  res.json(items);
});

app.post("/create-checkout-session", async (req, res) => {
  const item = items.find((i) => i.id === parseFloat(req.body.id));
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
          },
          unit_amount: item.priceInCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `http://localhost:1234/purchase-success?itemId=${item.id}&sessionId={CHECKOUT_SESSION_ID}`,
    cancel_url: "http://localhost:3000",
  });
  res.json({ url: session.url });
});

app.get("/purchase-success", async (req, res) => {
  const item = items.find((i) => i.id === parseFloat(req.query.itemId));
  const sessionData = await stripe.checkout.sessions.retrieve(
    req.query.sessionId
  );
  const customerEmail = sessionData.customer_details.email;
  linkContactAndProduct(customerEmail, item);
  sendDownloadLink(customerEmail, item);
  res.redirect("http://localhost:3000/download-links.html");
});

app.get("/downloads/:item", (req, res) => {
  const itemId = req.params.item;
  if (itemId == null) {
    return res.send("This link is invalid");
  }
  const item = items.find((i) => i.id === parseFloat(itemId));
  if (item == null) {
    return res.send("This item could not be found");
  }
  res.download(`downloads/${item.file}`);
});

app.post("/download-item", async (req, res) => {
  const email = req.body.email;
  const contact = await getContact(email);
  if (contact == null) return res.json({ valid: false });
  return res.json({ valid: true, listIds: contact.listIds });
});

function sendDownloadLink(email, item) {
  const downloadLink = `http://localhost:1234/downloads/${item.id}`;

  return sendEmail({
    email,
    subject: `Download ${item.name}`,
    htmlContent: `
      <h1>Thank you for purchasing ${item.name}</h1>
      <a href="${downloadLink}">Download it now</a>
    `,
    textContent: `Thank you for purchasing ${item.name}
Download it now. ${downloadLink}`,
  });
}

function sendEmail({ email, ...options }) {
  const headers = {
    "api-key": process.env.SEND_IN_BLUE_API_KEY,
  };
  const sender = {
    name: "Ezen",
    email: "ezen.gaston@gmail.com",
  };

  axios.post(
    "https://api.sendinblue.com/v3/smtp/email",
    {
      sender,
      replyTo: sender,
      to: [{ email }],
      ...options,
    },
    {
      headers,
    }
  );
}

async function linkContactAndProduct(email, item) {
  const contact = await getContact(email);
  if (contact == null) {
    return createContact(email, item);
  } else {
    return updateContact(contact.id, item);
  }
}

async function getContact(email) {
  try {
    const headers = {
      "api-key": process.env.SEND_IN_BLUE_API_KEY,
    };
    const response = await axios.get(
      `https://api.sendinblue.com/v3/contacts/${email}`,
      { headers }
    );
    return response.data;
  } catch (e) {
    if (e.response.status === 401 || e.response.status === 404) return null;
    throw e;
  }
}

function createContact(email, item) {
  const headers = {
    "api-key": process.env.SEND_IN_BLUE_API_KEY,
  };
  return axios.post(
    "https://api.sendinblue.com/v3/contacts",
    {
      email,
      listIds: [item.listId],
    },
    { headers }
  );
}

function updateContact(id, item) {
  const headers = {
    "api-key": process.env.SEND_IN_BLUE_API_KEY,
  };
  return axios.put(
    `https://api.sendinblue.com/v3/contacts/${id}`,
    {
      listIds: [item.listId],
    },
    { headers }
  );
}

app.listen(port);
