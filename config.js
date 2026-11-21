/* Backend address (admin panel + API). Used for live content, demo bookings, chatbot and contact forms.
   - On your own computer (localhost) the site automatically uses http://localhost:3000.
   - On the LIVE website, put the public address of your running backend in PROD_API below,
     for example 'https://api.siddhisoftwares.com'. Use https:// if the website itself is https://.
   - PROD_API left empty = demo content only: bookings and enquiries are NOT saved on the live site. */
(function(){
  var PROD_API='';
  var local=/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  window.SITE_CONFIG={API_BASE:local?'http://localhost:3000':PROD_API};
})();
