'use strict';

$('.dropdown_menu').hide();

$('.menu').click(() =>{
  $('.menu').hide();
  $('.dropdown_menu').show();
});

console.log('Hello from app.js');
