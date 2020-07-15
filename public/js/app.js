'use strict';

console.log('Hello from app.js');

$('.dropdown_menu').hide();

$('.menu').click(() =>{
  $('.menu').hide();
  $('.dropdown_menu').show();
});

$('.button_update').click(() => {
  $('.section_detail').hide();
  $('.form_updateBook').css('visibility', 'visible');
});
