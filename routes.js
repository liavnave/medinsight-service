const { pool } = require('./config');
const helpers = require('./utils/helpers');
const aws = require('./utils/aws');

/**
 * Retrieves Posts.
 * @method
 * @param {Object} request - An request.
 * @param {Object} response - An response.
 * 
 * @param {Object} request.query - the query of the  request.
 * @param {Number} query.limit  - number of items
 * @param {Number} query.offset - number of pages
 * @param {String} query.order_by - order by
 * @param {Number} query.parent_id - related post
 * 
 * @returns {Posts} Array of posts
 */
const getPosts = (request, response) => {
    const { limit, offset, order_by, parent_id } = request.query;
    getPool({ limit, offset, order_by, parent_id }, response);
}

/**
 * Add new Post.
 * @method
 * @param {Object} request - An request.
 * @param {Object} response - An response.
 * 
 * @param {Object} request.body - the body of the request.
 * @param {String} body.full_name - the name of the author
 * @param {String} body.email - the email of the author
 * @param {String} body.profession - the profession of the author
 * @param {String} body.institution - the institution name
 * @param {String} body.country - country name
 * @param {Number} body.parent_post_id - the parent post
 * @param {String} body.subject - the subject of the post
 * @param {String} body.content - the post text
 * @param {String} body.category - the category of the post
 * 
 * @returns {Object} { status, message }
 */
const addPost = (request, response) => {
    const {
        full_name,
        email,
        profession,
        institution,
        country,
        parent_post_id = null,
        subject,
        content,
        category } = request.body;

    aws.detectSentiment(content)
        .then(sentiment => {
            const post_sentiment = sentiment.Sentiment;
            const post_sentiment_score = sentiment.SentimentScore[Object.keys(sentiment.SentimentScore)
                .find(key => key.toLowerCase() === sentiment.Sentiment.toLowerCase())];
            pool.query(`INSERT INTO posts (
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
                post_sentiment_score) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id`,
                [full_name, email, profession, institution, country, parent_post_id,
                    subject, content, category, post_sentiment, post_sentiment_score],
                (error, res) => {
                    if (error) {
                        return response.status(500).send(error.message);
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
                            addTags(tags, response);

                        })
                        .catch(error => response.status(500).send(error.message));
                })

        })
        .catch(error => response.status(500).send(error.message));

}

/**
 * Retrieves Tags.
 * @method
 * @param {Object} request - An request.
 * @param {Object} response - An response.
 * 
 * @param {Object} request.query - the query of the  request.
 * @param {Number} query.post_id - related post.
 * 
 * @returns {Posts} Array of tags related to the requested post.
 */
const getTags = (request, response) => {
    const { post_id } = request.query;
    const query = `SELECT *
    FROM tags
    WHERE post_id = ${post_id};`;

    pool.query(query, (error, results) => {
        if (error) {
            return response.status(500).send(error.message);
        }
        response.status(200).json(results.rows)
    })
}

/**
 * Add Tags.
 * @method
 * @param {Object} data - An Object.
 * @param {Object} response - An response.
 * 
 * @param {Number} data.post_id - related post.
 * @param {String} data.tag - the tag.
 * @param {Number} data.tag_score - the tag score.
 * @param {Number} data.begin_offset - the tag begin position in the post.
 * @param {Number} data.end_offset - the tag end position in the post.
 * @param {String} data.category - the tag category.
 * 
 * @returns {Object} { status, message }.
 */
const addTags = (data, response) => {
    pool.query(`INSERT INTO tags (post_id, tag, tag_score, begin_offset, end_offset,
        category)
     VALUES ${helpers.expand(data.length, 6)}`,
        helpers.flatten(data),
        (err, res) => {
            if (err) {
                throw err;
            }
            response.status(201).json({ status: 'success', message: 'success' });
        })

}

/**
 * Retrieves Searched Posts.
 * @method
 * @param {Object} request - An request.
 * @param {Object} response - An response.
 * 
 * @param {Object} request.body - the body of the  request.
 * @param {String} body.text - search term.
 * 
 * @returns {Posts} Array of posts.
 */
const searchPosts = (request, response) => {
    const { text } = request.body;
    aws.detectEntities(text)
        .then(result => {
            const tags = result.Entities.map(entity => entity.Text);
            // If no tags are found, return empty array
            if (!tags.length) return response.status(200).json([]);
            const tagsString = tags.reduce((acc, tag, index) => {
                return acc += (index == tags.length - 1) ? `'${tag}')` : `'${tag}',`

            }, '(')

            pool.query(`SELECT post_id
            FROM tags
            WHERE tag in ${tagsString}`, (error, results) => {
                if (error) {
                    return response.status(500).send(error.message);
                }
                const idsString = results.rows.reduce((acc, { post_id }, index) => {
                    return acc += (index == results.rows.length - 1) ? `${post_id})` : `${post_id},`

                }, '(')
                getPool({ ids: idsString }, response);
            })

        })
        .catch(error => response.status(500).send(error.message));


}

const getPool = ({ limit = null, offset = 0, order_by = 'date_published', ids, parent_id = null }, response) => {
    let query = `SELECT * FROM posts`;
    // get post by id
    if (ids) query += ` WHERE id in ${ids} And parent_post_id IS NULL`;
    else {
        // if parent_id exist - return the comments of the post else return only posts
        if (parent_id) query += ` WHERE parent_post_id = ${parent_id}`;
        else query += ` WHERE parent_post_id IS NULL`;
    }

    // ORDER BY/LIMIT/OFFSET
    query += ` ORDER BY ${order_by} LIMIT ${limit} OFFSET ${offset}`;

    pool.query(query, (error, results) => {
        if (error) {
            return response.status(500).send(error.message);
        }
        response.status(200).json(results.rows)
    })
}

module.exports = {
    getPosts,
    addPost,
    getTags,
    searchPosts
}