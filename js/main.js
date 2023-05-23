const fetch = require("node-fetch");
const http = require("http");
const express = require("express");
const nodemailer = require("nodemailer");
const xoauth2 = require("xoauth2");
const cors = require("cors");
const app = express();

app.use(cors());
const {
  collection,
  addDoc,
  getDocs,
  getFirestore,
  doc,
  updateDoc,
  setDoc,
  arrayUnion,
  getDoc,
} = require("firebase/firestore");
const { initializeApp } = require("firebase/app");

// Import the functions you need from the SDKs you need

const { getAnalytics } = require("firebase/analytics");
const { url } = require("inspector");
const SMTPTransport = require("nodemailer/lib/smtp-transport");
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA8bm0bRgip4G1e3zMu9w6O5Mgb97493Ng",
  authDomain: "releason.firebaseapp.com",
  projectId: "releason",
  storageBucket: "releason.appspot.com",
  messagingSenderId: "863519135834",
  appId: "1:863519135834:web:4c8bfb065f8e8e02676063",
  measurementId: "G-C17D10WLQ2",
};

// Initialize Firebase
const appFire = initializeApp(firebaseConfig);
// const analytics = getAnalytics(appFire);

const db = getFirestore(appFire);

const getAllURLS = async function () {
  const querySnapshot = await getDocs(collection(db, "logins"));

  const accs = [];

  querySnapshot.forEach((doc) => {
    const acc = { email: doc.data().email, urls: doc.data().urls };
    accs.push(acc);
  });
  return accs;
};

const set204s = async function (url) {
  try {
    const docRef = await addDoc(collection(db, "204"), {
      url: url,
    });
  } catch (err) {
    console.log("204", err);
  }
};

const setNobodys = async function (url) {
  try {
    const docRef = await addDoc(collection(db, "nobody"), {
      url: url,
    });
  } catch (err) {
    console.log("204", err);
  }
};
const sendEmail = async function (email, url, purpose) {
  let transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "nateheffgk05@gmail.com",
      pass: "rtxxbcsmennfnusa",
    },
  });
  if (purpose == 204) {
    let info = await transporter.sendMail({
      from: '"contact@releasom.com', // sender address
      to: email, // list of receivers
      subject: "Unable to Use the Link You Entered", // Subject line
      text: `We were unable to track ${url}. Please make sure this si the link to the SHOP page of the site you want to track and the ssite is not HUGE. If you are sure this link should work, you can reach out to our dev personally at nateheffgk05@gmail.com \n\n\n-Releason Team`, // plain text body
    });
  }
  if (purpose == "nobody") {
    let info = await transporter.sendMail({
      from: '"contact@releasom.com', // sender address
      to: email, // list of receivers
      subject: "We Can't Track the Site You Inputted :(", // Subject line
      text: `The site at ${url} doesn't seem to be working with out system. It may just be an error so feel free to try again once, but if you get this email again, then we are unfortunately unable to support that url at this time. Releason is currently very small, but as it grows, we will add support for more and more types of site so please be patient! \n\n\n-Releason Team`, // plain text body
    });
  }
  if (purpose == "new") {
    let info = await transporter.sendMail({
      from: '"contact@releasom.com', // sender address
      to: email, // list of receivers
      subject: "One of Your Favorite Sites Just Dropped!", // Subject line
      text: `We've detected a change at ${url}! Check it out to see if there's anything new and exciting! \n\n\n-Releason Team`, // plain text body
    });
  }
  if (purpose == "test") {
    let info = await transporter.sendMail(
      {
        from: '"contact@releasom.com', // sender address
        to: email, // list of receivers
        subject: "Test", // Subject line
        text: `We've detected a change at ${url}! Check it out to see if there's anything new and exciting! \n\n\n-Releason Team`, // plain text body
      },
      (err, res) => {
        if (err) {
          console.log(err);
        } else {
          console.log("we're okay");
          return;
        }
      }
    );
  }
};

const getSendEmails = async function (url, purpose) {
  const accs = await getAllURLS();
  accs.forEach(async (acc) => {
    if (acc.urls.includes(url)) {
      await sendEmail(acc.email, url, purpose);
    } else {
      return;
    }
  });
};

const currentBods = [];

const getBody = async function (url) {
  try {
    const res = await fetch(`${url}`, {
      method: "GET",
      headers: {
        "User-Agent": "*",
        Accept: "text/html",
      },
    });
    if (res.status == 204) {
      await getSendEmails(url, 204);
      set204s(url);
      return;
    }

    const rough = await res.text();

    const body = String(rough).split("<body")[2];
    if (!body) {
      await getSendEmails(url, "nobody");
      setNobodys(url);
      return;
    }

    const currentSite = currentBods.find((site) => site.url == url);

    if (!currentSite) {
      currentBods.push({ body: body, url: url });
      await getSendEmails(url, "test");
      console.log(`added something new to ${url}`);
    } else if (currentSite.body != body) {
      await getSendEmails(url, "new");
      const ind = currentBods.findIndex((site) => {
        site.url == url;
      });

      currentBods.splice(ind, 1);
      currentBods.push({ body: body, url: url });
      console.log(`replaced something old for ${url}`);
    } else if (currentSite.body == body) {
      console.log(`nothing new for ${url}`);
    }

    setTimeout(function () {
      getBody(url);
    }, 10000);
  } catch (err) {
    console.log(err);
    return;
  }
};

const curURLS = [];
const runIt = async function () {
  const accs = await getAllURLS();

  const urls = accs.flatMap((acc) => acc.urls);
  if (urls == curURLS) {
    return;
  }

  curURLS.splice(0, curURLS.length - 1);
  curURLS.push(urls);
  urls.forEach((url) => {
    getBody(url);
  });

  setTimeout(function () {
    runIt();
  }, 10000);
};
runIt();

// const maybePlease = async function () {
//   const res = await fetch(
//     "https://synchtec.net/collections/last-drop-forreal",
//     {
//       method: "GET",
//       headers: {
//         "User-Agent": "*",
//         Accept: "text/html",
//       },
//     }
//   );
//   const maybe = await res.text();
//   console.log(maybe);
// };

// maybePlease();

app.listen(() => {
  console.log("server running on port 5000");
});
