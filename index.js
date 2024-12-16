const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('coffee server in running')
})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.n4px1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();


        const userCollection = client.db('visaDB').collection('users')
        const visaCollection = client.db('visaDB').collection('visa')
        const applyVisaCollection = client.db('visaDB').collection('applyVisa')



        app.get("/allVisa", async (req, res) => {
            const cursor = visaCollection.find();
            const result = await cursor.toArray();
            res.send(result)

        })
        app.get("/latestVisa", async (req, res) => {
            try {
                const cursor = visaCollection.find().sort({ createdAt: -1 }).limit(6);
                const result = await cursor.toArray();
                res.send(result)
            }
            catch (error) {
                console.error(error);
                res.status(500).send({ error: "Failed to fetch latest visa records" });
            }


        })

        app.get("/myAddedVisa", async (req, res) => {
            try {
                const userEmail = req.query.email;

                if (!userEmail) {
                    return res.status(400).send({ error: "Email is required to fetch user-specific data" });
                }
                const cursor = visaCollection.find({ userEmail })
                const result = await cursor.toArray();
                res.send(result)
            }
            catch (error) {
                console.error(error);
                res.status(500).send({ error: "Failed to fetch latest visa records" });
            }
        })

        app.get("/applyVisa", async (req, res) => {
            try {
                const email = req.query.email;

                if (!email) {
                    return res.status(400).send({ error: "Email is required to fetch user-specific data" });
                }
                const cursor = applyVisaCollection.find({ email })
                const result = await cursor.toArray();
                res.send(result)
            }
            catch (error) {
                console.error(error);
                res.status(500).send({ error: "Failed to fetch latest visa records" });
            }
        })

        app.delete("/applyVisa/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            try {
                const result = await applyVisaCollection.deleteOne(query);
                res.send(result);
            } catch (error) {
                console.error("Error deleting coffee:", error);
                res.status(500).send({ error: "Failed to delete coffee" });
            }
        });

        app.get("/allVisa/:id", async (req, res) => {
            const id = req.params.id;

            try {
                const visa = await visaCollection.findOne({ _id: new ObjectId(id) });
                if (visa) {
                    res.send(visa);
                } else {
                    res.status(404).send({ error: "Visa not found" });
                }
            } catch (error) {
                console.error("Error fetching visa details:", error);
                res.status(500).send({ error: "Internal Server Error" });
            }
        });



        app.post('/addVisa', async (req, res) => {
            const newVisa = req.body;

            const result = await visaCollection.insertOne(newVisa)
            res.send(result)
        })


        app.post('/applyVisa', async (req, res) => {
            try {
                const newVisa = req.body;
                console.log("Received visa application data:", newVisa);  // Log incoming data
                const result = await applyVisaCollection.insertOne(newVisa);
                console.log("Visa application inserted:", result);
                res.send(result);
            } catch (error) {
                console.error("Error handling visa application:", error);
                res.status(500).send({ message: "An error occurred while processing your request." });
            }
        });



        app.put('/allVisa/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedVisa = req.body;

            const updateDoc = {
                $set: {
                    countryName: updatedVisa.countryName,
                    countryImage: updatedVisa.countryImage,
                    visaType: updatedVisa.visaType,
                    processingTime: updatedVisa.processingTime,
                    fee: updatedVisa.fee,
                    validity: updatedVisa.validity,
                    applicationMethod: updatedVisa.applicationMethod,
                    ageRestriction: updatedVisa.ageRestriction,
                    description: updatedVisa.description,
                    requiredDocuments: updatedVisa.requiredDocuments,
                },
            };

            try {
                const result = await visaCollection.updateOne(filter, updateDoc, options);
                res.send(result);
            } catch (error) {
                console.error("Error updating visa:", error);
                res.status(500).send({ error: "Failed to update visa" });
            }
        });


        // User related api
        app.get('/users', async (req, res) => {
            const cursor = userCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.post('/users', async (req, res) => {
            const newUser = req.body;
            const result = await userCollection.insertOne(newUser)
            res.send(result)
        })

        app.delete("/users/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query)
            res.send(result)
        })

        app.patch('/users', async (req, res) => {
            const email = req.body.email;
            const filter = { email }
            const updateDoc = {
                $set: {
                    lastSignInTime: req.body?.lastSignInTime
                }

            }
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`coffee server is running on port: ${port}`)
})