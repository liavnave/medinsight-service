const fs = require("fs");
const path = require('path');
const fastcsv = require("fast-csv");
const stringify = require('csv-stringify');
const aws = require('../utils/aws');

const csvPath = path.resolve(__dirname, 'output.csv');

const init = () => {
    let output = [
        [
            "id",
            "subject",
            "country",
            "date_published",
            "parent_post_id",
            "cmt_level",
            "institution",
            "fullname",
            "email",
            "sent_id",
            "sentence",
            "post_sentiment",
            "post_sentiment_score",
            "tags"
        ]
    ];
    const file = path.resolve(__dirname, 'data.csv')
    let stream = fs.createReadStream(file);
    let csvData = [];
    let csvStream = fastcsv
        .parse()
        .on("data", function (data) {
            csvData.push(data);
        })
        .on("end", function () {
            // remove the first line: header
            csvData.shift();
            const data = csvData;
            data.forEach((row, index) => {
                setTimeout(() => {
                    addPost(row).then(row => {
                        output.push(Object.values(row));
                        console.log(`row number ${index + 1} is in process`);

                        if (data.length == output.length - 1) {
                            stringify(output, function (err, output) {
                                fs.writeFile(csvPath, output, 'utf8', function (err) {
                                    if (err) {
                                        console.log('Some error occured - file either not saved or corrupted file saved.');
                                    } else {
                                        console.log('output.csv was saved!');
                                    }
                                });
                            });
                        }
                    });

                }, index * 300);
            })
        });

    stream.pipe(csvStream);
}

const addPost = (data) => {

    const [
        id,
        subject,
        country,
        date_published,
        parent_post_id,
        cmt_level,
        institution,
        fullname,
        email,
        sent_id,
        sentence
    ] = data;

    return aws.detectSentiment(sentence)
        .then(sentiment => {
            const post_sentiment = sentiment.Sentiment;
            const post_sentiment_score = sentiment.SentimentScore[Object.keys(sentiment.SentimentScore)
                .find(key => key.toLowerCase() === sentiment.Sentiment.toLowerCase())];

            const post = {
                id,
                subject,
                country,
                date_published,
                parent_post_id,
                cmt_level,
                institution,
                fullname,
                email,
                sent_id,
                sentence,
                post_sentiment,
                post_sentiment_score
            }
            return aws.detectEntities(sentence)
                .then(result => {
                    const tags = [];
                    result.Entities.forEach(entity => {
                        const tag = entity.Text
                        tags.push(tag);
                    });
                    post.tags = tags.join();
                    return post;

                })
                .catch(error => {
                    post.tags = '';
                    return post;
                });

        })
        .catch(error => {
            console.log('err', error)
        });

}

init();