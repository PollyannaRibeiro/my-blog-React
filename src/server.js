import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
  //since we are using to much "await" inside a callback function, 
  //in order for everything works we need to add "async" to our callback 
  try{
    //wrap the code in a try catch block in case something goes whong 
    //with the database operations 
  
    const client = await MongoClient.connect('mongodb://localhost:27017', {useNewUrlParser: true});
    const db = client.db('my-blog'); //ready to access the database

    await operations(db);

    client.close(); // to close the connection with the database
  } catch(error){
    res.status(500).json({ message: 'Error connecting to db', error });
    //  500 - inside server error
  }
}
 
app.get('/api/articles/:name', async (req, res) =>{
  withDB(async (db) => {
    const articleName = req.params.name;

    const articlesInfo = await db.collection('articles').findOne({ name: articleName })
    res.status(200).json(articlesInfo); //status 200 - everything is ok
  }, res);
  
  
});

app.post('/api/articles/:name/upvote', async (req, res)=>{

  withDB( async (db)=>{
    const articleName = req.params.name;

    const articleInfo = await db.collection('articles').findOne({ name:articleName});
    await db.collection('articles').updateOne({ name:articleName }, {
      '$set':{
        upvotes: articleInfo.upvotes+1
      },
    }, res);

    const updatedArticleInfo = await db.collection('articles').findOne({ name:articleName});
    res.status(200).json(updatedArticleInfo);
  });

});

app.post('/api/articles/:name/add-comment', (req, res) =>{
  const {username, text} = req.body;
  const articleName = req.params.name;

  withDB( async (db)=>{
    const articleInfo = await db.collection('articles').findOne({ name: articleName});

    await db.collection('articles').updateOne({ name: articleName}, {
      '$set':{
        comments: articleInfo.comments.concat({username, text}),
      },
    });
    const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
    res.status(200).json(updatedArticleInfo);
  }, res);

});

app.get('*', (req, res) =>{
  res.sendFile(path.join(__dirname + '/build/index.html'));
});
app.listen(8000, () => console.log('Listening on port 8000'));