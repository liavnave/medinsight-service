const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersions: '2018-10-30'
});

const comprehendmedical = new AWS.ComprehendMedical();
const comprehend = new AWS.Comprehend();

const detectEntities = (text) => {
  return new Promise((resolve, reject) => {
    const options = {
      Text: text
    };
    comprehendmedical.detectEntitiesV2(options, (err, result) => {
      if (err) reject(err.message);
      else resolve(result);
    });
  })

}

const detectSentiment = (text) => {
  return new Promise((resolve, reject) => {
    const options = {
      LanguageCode: 'en',//en | es | fr | de | it | pt | ar | hi | ja | ko | zh | zh-TW
      Text: text
    };
    comprehend.detectSentiment(options, (err, result) => {
      if (err) reject(err.message);
      else resolve(result);
    });
  })
}

module.exports = {
  detectEntities,
  detectSentiment
}