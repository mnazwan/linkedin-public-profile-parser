var cheerio = require('cheerio');
/**
 * profile method finds data in a give public profile page
 * @param {String} url - a valid Linkedin profile url
 * @param {String} html - the full html for the public profile page
 * @param {Function} next - the callback we should call after scraping
 *  a callback passed into this method should accept two parameters:
 *  @param {Objectj} error an error object (set to null if no error occurred)
 *  @param {Object} data - the complete Linkedin Profile for the given url
 */
module.exports = function profile(url, html, next) {
  var $ = cheerio.load(html); // use Server-Side JQuery to access DOM
  var data = { url: url };    // store all parsed data inside data object

  // remove hidden fields to improve accuracy
  $(".visually-hidden").remove();

  data.connections = parseInt($('[class*=top-card] [class*=connections]').text().trim(), 10);
  data.fullname = $('[class*=top-card] [class*=name]').text();
  data.location = $('[class*=top-card] [class*=location]').text();
  data.current = $('[class*=top-card] [class*=headline]').text();
  data.picture = $('[class*=top-card] [class*=photo] img')[0].attribs.src;
  data.summary = $('p[class*=summary]').text().trim(); // element always present on page

  var skills = $('[class*=skill-name]');
  data.skills = [];
  skills.each(function (i, elem) {
    data.skills.push($(this).text())
  });

  var langs = $('[class*=languages] li[class*=accomplishment]');
  data.languages = [];
  langs.each(function (i, elem){
    var lang = $(this).find("h4[class*=title]").text().trim();
    var fluency = $(this).find("[class*=proficiency]").text().trim();
    data.languages.push(lang + ' - ' + fluency);
  });

  data.experience = {current:[], past:[]}; // empty if none listed
  var experience = [];
  var positions = $("[class*=position-entity]");
  var exp = {};
  positions.each(function (i, elem){
    var item = $(this).find("[class*=summary]");
    exp = {}; // reset experience object
    exp.title = item.children(":nth-child(1)").text();
    exp.org = item.children(":nth-child(2)").text().trim();
    exp.date = item.children(":nth-child(3)").text().trim();
    exp.duration = item.children(":nth-child(4)").text().trim();
    exp.location = item.children(":nth-child(5)").text().trim();
    exp.desc = $(this).find("[class*=description]").html().trim();
    experience.push(exp);
  });
  data.experience.current = experience.filter(function(exp){
    return exp.date.match(/Present/);
  });
  data.experience.past = experience.filter(function(exp){
    return exp.date.indexOf('Present') === -1;
  })

  next(null, data);
}