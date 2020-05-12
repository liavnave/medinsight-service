
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  date_published date not null default CURRENT_DATE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  profession VARCHAR(255) NOT NULL,
  institution VARCHAR(255) NOT NULL,
  country VARCHAR(255) NOT NULL,
  parent_post_id INTEGER REFERENCES posts(id),
  subject VARCHAR(255),
  content text NOT NULL,
  category VARCHAR(255) NOT NULL,
  post_sentiment VARCHAR(255)
  post_sentiment_score decimal
);

INSERT INTO posts (
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
post_sentiment_score)
VALUES  (
'israel israeli',
'test@gmail.com', 
'profession', 
'institution',
'IL',
null,
'subject',
'Smokers are likely to be more vulnerable to COVID-19 as the act of smoking means that fingers (and possibly contaminated cigarettes) are in contact with lips which increases the possibility of transmission of virus from hand to mouth. Smokers may also already have lung disease or reduced lung capacity which would greatly increase risk of serious illness.

Smoking products such as water pipes often involve the sharing of mouth pieces and hoses, which could facilitate the transmission of COVID-19 in communal and social settings.

Conditions that increase oxygen needs or reduce the ability of the body to use it properly will put patients at higher risk of serious lung conditions such as pneumonia.',
'category',
'NEUTRAL',
0.965821385);