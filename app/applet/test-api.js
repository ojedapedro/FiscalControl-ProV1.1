const API_URL = 'https://script.google.com/macros/s/AKfycbwgYiuOojnTJKpIHFhZZdRfbVARETVcZwYFpwj8aREzPOJmDh6-MfQ-ug0Ayx04irj-1g/exec';
fetch(`${API_URL}?action=getEmployees`)
  .then(res => {
    console.log('Status:', res.status);
    return res.text();
  })
  .then(text => console.log('Body:', text))
  .catch(err => console.error(err));
