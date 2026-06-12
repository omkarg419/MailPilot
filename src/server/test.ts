import 'dotenv/config';
import { corsair } from "./corsair";

const main=async()=>{
    // const res= await corsair.withTenant('dev').gmail.api.threads.list({}) -> this is the api call to get the threads once we  cache the api call in corsair_entities table we can use the db call to get the threads
    // const res= await corsair.withTenant('dev').gmail.db.threads.list({}) -> this is the db call to get the threads
    const res= await corsair.withTenant('dev').gmail.db.threads.list({})
    console.log(res);
}

main();