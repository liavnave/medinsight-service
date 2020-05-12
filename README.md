# MedInsight

## Quick Start
1. clone medinsight-service
2. clone medinsight-ui

```sh
cd medinsight-ui
yarn
yarn build
cd ..
cd medinsight-service
npm install
npm run start
```
### OR
```
npm run start:dev
```
automatically restarting the node application when file changes


Then Open [http://localhost:3000](http://localhost:3000) to see your app.<br>
Open [http://localhost:3000/api/test](http://localhost:3000/api/test) to view the ***Swagger Editor***


## Project Structure
```
medinsight
├── README.md
├── app.js
├── config.js
├── scripts
│   ├── csv.js
│   ├── data.csv
├── package.json
├── routes.js
├── sql
│   ├── posts.sql
│   └── tags.sql
├── swagger
│   └── swagger.json
└── utils
    ├── aws.js
    └── helpers.js
```

No configuration or complicated folder structures, only the files you need to build your app.

## Data

### The Database
PostgreSQL - open source object-relational database

1. To create the DB you can use the `/sql/posts.spl` and `/sql/tags.spl`

### Create csv with sentiment and tags
This script receives a CSV of sentence of posts, adds sentiment and tags to each sentence.<br>
1. replace the csv file `/scripts/data.csv` (sample data file)
2. run `npm csv`
3. the output will be `/scripts/output.csv`







