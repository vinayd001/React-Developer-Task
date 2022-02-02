import axios from "axios";
import React, { useEffect, useState } from "react";
import Dexie from "dexie";
import InfiniteScroll from "react-infinite-scroll-component";

const cards = {
  display: "flex",
  flexWrap: "wrap",
  width: "80%",
  margin: "1rem auto",
  gap: "2rem",
  flex: 1,
  flexDirection: "row",
  textAlign: "left",
};

const InfiniteScrolling = () => {
  //set the database
  const db = new Dexie("mydb");

  //create the database store
  db.version(1).stores({
    events: "id, type, datetime_utc, title, popularity, url",
  });

  db.open().catch((err) => {
    console.log(err.stack || err);
  });

  const [events, setEvents] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const perPage = 20;

  const fetchMoreEvents = async () => {
    try {
      const response = await axios(
        process.env.REACT_APP_API_URL +
          `&page=${pageNumber}&per_page=${perPage}`
      );
      // console.log("response data", response.data.events);

      //add the new events to the database
      const newEventsDetails = response.data.events.map((event) => {
        return {
          id: event.id,
          type: event.type,
          datetime_utc: event.datetime_utc,
          title: event.title,
          popularity: event.popularity,
          url: event.url,
        };
      });

      db.events
        .bulkPut(newEventsDetails)
        .then(() => {
          //add the new events to the <database> </database>);
          // console.log("bulkPut events success");
          setEvents([...events, ...newEventsDetails]);
        })
        .catch(Dexie.BulkError, function (e) {
          // Explicitely catching the bulkAdd() operation makes those successful
          // additions commit despite that there were errors.
          console.error(
            "Some events did not succeed. However, " +
              20 -
              e.failures.length +
              " events was added successfully"
          );
        });

      setPageNumber(pageNumber + 1);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchEventsFromDb = async () => {
    // console.log("fetchEventsFromDb started");
    try {
      const allEvents = await db.events.toArray();
      // console.log("fetchEventsFromDb allEvents", allEvents);
      setEvents(allEvents);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const fetchDB = async () => {
      const allEvents = await db.events.toArray();
      // console.log("useEffect result", allEvents);
      if (allEvents.length === 0) {
        await fetchMoreEvents();
      } else {
        await fetchEventsFromDb();
      }
    };

    fetchDB();
  }, []);

  return (
    <div>
      <h1 style={{ width: "80%", margin: "1.5rem auto" }}>
        React Developer Task
      </h1>
      <hr />
      <InfiniteScroll
        style={{ textAlign: "center" }}
        dataLength={events.length}
        next={fetchMoreEvents}
        hasMore={true}
        loader={<h4>Loading...</h4>}
      >
        <div style={cards}>
          {events
            ? events.map((e, index) => (
                <div key={index}>
                  <div>Title: {e.title}</div>
                  <div>Id: {e.id}</div>
                  <div>Popularity: {e.popularity}</div>
                  <div>Type: {e.type}</div>
                  <div>DateTime: {e.datetime_utc}</div>
                  <div>URL: {e.url}</div>
                </div>
              ))
            : null}
        </div>
      </InfiniteScroll>
    </div>
  );
};

export default InfiniteScrolling;
