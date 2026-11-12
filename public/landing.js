const form = document.querySelector('#signin-form');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  window.location.assign('/?login=1');
});
