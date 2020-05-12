const fs = require("fs");
const path = require('path');
const fastcsv = require("fast-csv");
const { pool } = require('../config');
const helpers = require('../utils/helpers');
const aws = require('../utils/aws');

const init = () => {
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
            const data = csvData.slice(1000, 1070)
            data.forEach((row, index) => {
                setTimeout(() => {
                    addPost(row);
                    if (data.length == index + 1)
                        console.log('done')
                }, index * 5000);
            })
        });

    stream.pipe(csvStream);
}

const addPost = (data) => {
    const [id,
        subject,
        content,
        country,
        profession,
        date_published,
        parent_post_id,
        institution,
        full_name,
        email] = data;
    const category = '';
    const [date, hour] = date_published.split(' ');
    let splitBy = '-';
    if (date.includes('/')) {
        splitBy = '/';
    }
    const parent_id = parent_post_id ? parent_post_id : null;
    const [day, month, year] = date.split(splitBy);
    const postDate = `${month}/${day}/20${year} ${hour}`;
    aws.detectSentiment(content)
        .then(sentiment => {
            const post_sentiment = sentiment.Sentiment;
            const post_sentiment_score = sentiment.SentimentScore[Object.keys(sentiment.SentimentScore)
                .find(key => key.toLowerCase() === sentiment.Sentiment.toLowerCase())];
            pool.query(`INSERT INTO posts (
                id,
                date_published,
                full_name,
                email,
                profession,
                institution,
                country,
                parent_post_id,
                subject,
                content,
                category,
                post_sentiment,
                post_sentiment_score) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING id`,
                [id, postDate, full_name, email, profession, institution, country, parent_id,
                    subject, content, category, post_sentiment, post_sentiment_score],
                (error, res) => {
                    if (error) {
                        console.log('err', error)
                        return;
                    }
                    const id = res.rows[0].id;
                    aws.detectEntities(content)
                        .then(result => {
                            const tags = [];
                            result.Entities.forEach(entity => {
                                const tag = [
                                    id,
                                    entity.Text,
                                    entity.Score,
                                    entity.BeginOffset,
                                    entity.EndOffset,
                                    entity.Category
                                ];
                                tags.push(tag);
                            });
                            pool.query(`INSERT INTO tags (post_id, tag, tag_score, begin_offset, end_offset,
                                category)
                             VALUES ${helpers.expand(tags.length, 6)}`,
                                helpers.flatten(tags),
                                (err, res) => {
                                    if (err) {
                                        console.log(err)
                                    }
                                })

                        })
                        .catch(error => {
                            console.log('err', error)
                        });
                })

        })
        .catch(error => {
            console.log('err', error)
        });

}

init();