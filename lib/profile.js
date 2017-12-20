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

  data.url = $('[class*=contact-link]')[0].attribs.href;
  data.connections = $('[class*=top-card] [class*=connections]').text().trim();
  data.fullname = $('[class*=top-card] [class*=name]').text();
  data.location = $('[class*=top-card] [class*=location]').text();
  data.current = $('[class*=top-card] [class*=headline]').text();
  data.summary = $('p[class*=summary]').text().trim(); // element always present on page

  data.picture = $('[class*=top-card] [class*=photo] img')[0];
  if (data.picture) {
    data.picture = data.picture.attribs.src;
  }
  else {
    data.picture = $('[class*=top-card] [class*=entity__image]').css('background-image');
    if (data.picture) {
      data.picture = data.picture.match(/http.*.jpg/g)[0];
    }
  }

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
  var exp;
  var item;
  positions.each(function (i, elem){
    item = $(this).find("[class*=summary]");
    exp = {}; // reset experience object
    exp.title = item.children(":nth-child(1)").text();
    exp.org = item.children(":nth-child(2)").text().trim();
    exp.date = item.children(":nth-child(3)").text().trim();
    exp.duration = item.children(":nth-child(4)").text().trim();
    exp.location = item.children(":nth-child(5)").text().trim();
    exp.desc = $(this).find("[class*=description]").html();
    if (exp.desc) {
      exp.desc = exp.desc.trim();
    }
    experience.push(exp);
  });
  data.experience.all = experience;
  data.experience.current = experience.filter(function(exp){
    return exp.date.match(/Present/);
  });
  data.experience.past = experience.filter(function(exp){
    return exp.date.indexOf('Present') === -1;
  })

  data.education = [];
  var educations = $("[class*=education-entity]");
  var edu;
  educations.each(function (i, elem){
    edu = {};
    edu.name = $(this).find("[class*=school-name]").text();
    edu.degree = $(this).find("[class*=degree-name]").text().trim();
    edu.fos = $(this).find("[class*=fos]").text().trim();
    edu.grade = $(this).find("[class*=grade]").text().trim();
    edu.date = $(this).find("[class*=date]").text().trim();
    data.education.push(edu);
  });

  data.recommendations = [];
  var pattern = new RegExp(/^Received \(/);
  var recsExists = pattern.test($("[class*=recommendations-section] [role=tab].active").text().trim());
  if (recsExists){
    var recommendations = $("[class*=recommendations-section] [class*=tabpanel].active li[class*=recommendation-entity]");
    var recs;
    var meta;
    recommendations.each(function (i, elem){
      recs = {};
      recs.name = $(this).find("[class*=detail]").children(":nth-child(1)").text();
      recs.title = $(this).find("[class*=detail]").children(":nth-child(2)").text();
      recs.desc = $(this).find("[class*=highlight]").text().trim();
      meta = $(this).find("[class*=detail]").children(":nth-child(3)").text().trim();
      meta = meta.match(/(.*),(.*)/);
      recs.date = meta[1];
      recs.relationship = meta[2].trim();
      data.recommendations.push(recs);
    });
  }

  data.certifications = [];
  var certs = $("[class*=certifications] li[class*=accomplishment-entity]");
  var cert;
  if (certs.length > 0) {
    certs.each(function (i, elem){
      cert = {};
      cert.title = $(this).find(":nth-child(1)[class*=title]").text().trim();
      cert.date = $(this).find(":nth-child(1)[class*=date]").text().trim();
      data.certifications.push(cert);
    });
  } else {
    certs = $("[class*=certifications] li[class*=list-item]");
    certs.each(function (i, elem){
      cert = {};
      cert.title = $(this).text().trim();
      data.certifications.push(cert);
    });
  }

  next(null, data);
}