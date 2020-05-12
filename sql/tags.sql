
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id),
  tag VARCHAR(255) NOT NULL,
  tag_score decimal NOT NULL,
  begin_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  category VARCHAR(255) NOT NULL 
);


INSERT INTO tags (post_id,
tag,
tag_score,
begin_offset,
end_offset,
category)
VALUES  (
1,
'outbreak', 
0.62203742265701294,
2,
12,
'MEDICAL_CONDITION');