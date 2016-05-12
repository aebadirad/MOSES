#MOSES 
##(Marklogic Originating Spatial Evaluation Service)

Data is derived from www.geonames.org, modified to fit a NoSQL document format, all else is original work.
Uses the [Roxy framework](https://github.com/marklogic/roxy) and [Marklogic Content Pump](https://developer.marklogic.com/products/mlcp) to deploy.

[Demo is available at http://ebadirad.com:8055](http://ebadirad.com:8055/)

---
##VERSION: 0.2-Alpha

##Features:
- Gazetter
  - Ability to search by text of names or known associated names (Big Apple for NYC)
  - Polygon/circle bounded search
  - Filter by class of feature to find (political border, natural geological formation)
  - Filter by specific type of feature (building, city, capitol, country, forest)
  - Nearest to point search: if given a point and any of the criteria above, find the closest place
  - Multilingual - supports both native language and to ASCII names
- Geospatial entity extraction and text enrichment
  - Translate from text to specific location
  - Contextual analysis
  - Built in parts of speech and ruled based tagger OR
  - Integration with Stanford NLP
  - Automatic multiple entity resolution (London in Ohio is not the same as London, England)
  - Organization geospatial identifiers (the Pentagon -> the building in DC, CNN -> the CNN Headquarters building in Atlanta)
  - Multilingual - supports both native language and to ASCII names
  - Airport Codes! PDX to SFO will produce the airports in Portland, Oregon and San Fran, California.
- Low memory and processor usage! Demo runs only on 2 vcores and 8 gigs of ram
- Low diskspace usage, total disk is under 40GB.


###New features added in 0.2-Alpha!

1. Stanford NLP integration! You can use this now instead of the built in pos tagger!
2. High accuracy, nearest-neighbor entity resolution! London, Ohio and London, England won't be confused again!
3. (in progress) Semantic based entity identfication, words around the location's text itself help identify what it is (city, state, airport, etc)

Notice:
A lot of the code is messy and the built in API is really made just to make the demo work.

Now that it is in alpha, refactoring, functionization, optimization, general code clean up, standardization of conventions (naming and coding!), and API documentation need to be done.

This is not released under a license yet, contact for information to use in a commercial/government capacity.

###.3-Alpha Roadmap:
1. Refactor code to standardize all database queries
2. Create usable utility library to handle all data formatting
3. Standardize naming convention of all variables/objects/functions
4. Multi-sentence context parsing. The ability to look backwards and forwards for a nearest neighbor to match when there's nothing in the current sentence to help anchor.

###.4-Alpha Roadmap:
1. Incorporate advanced entity resolution from current NLP to built-in capability
2. Increase resolution on organization/individual buildings
3. External configuration file

###.5-Alpha Roadmap:
1. Optimization of enrichment processing
2. Multipolygon support for search capability
3. Accept XML input and output 

###.6-Alpha Roadmap:
1. Suggested locations (locations like this)
2. Custom weighting
3. Metrics capturing

###.7-Alpha Roadmap:
1. API call to ingest new locations/data into database
2. More to come.


---
##REQUIRED SOFTWARE

Server:
Linux, Solaris, Unix, or Windows.
MarkLogic. That's it.

Deployer (these do not need to be on the server with MarkLogic):
Ruby 2.7 or later.
Java 7 or later.
Node 0.12 or later.

Yes, I know it's annoying to have to install 3 things to build the data files, set up the server,
and push the content.

I'm working on it to reduce it to just java/node, and hopefully just node eventually.

Developed on both windows 7/10 x64 and centos 6/7, all else is untested.

---
##REQUIRED HARDWARE

A production version of this will not be insignificant in terms of hardware.

The design is heavily weighted to use disk space to optimize on ram and cpu, so use SDDs if possible.

For development you'll want around 2 cpus and 8 gigs of ram. You can get away with less, but initial 
ingestion of the data will be pretty miserable if you do. For reference: the demo runs on a dedicated 
bare metal 2 cpu, 8 gig of ram linux box.

For light production you'll want at least 4 cores, 8 gigs of ram. This is for very light use. Why 8 gigs?
We leverage MarkLogic's native use of indexes, so actually load very little into memory even across large 
queries.

For anything that gets over a few thousand hits an hour, you'll need at least a 4-6 core with 16 gigs of ram.

For public services, you'll want a 12+ core, 32 gig ram setup. You should be able to serve millions of requests an hour.

**DISK SPACE FOR ALL SETUPS: You should have least 40gigs of free HD space. SSD is HIGHLY recommended (major performance).**

---
###OPTIONAL SOFTWARE

A [Stanford NLP](http://stanfordnlp.github.io/CoreNLP/) server instance is optional. If you require high accuracy
 (beyond the built-in) or any sort of reliable text enrichment or entity extraction, you will need this. You must be 
running a server for MOSES to hit, instructions for doing that are [here](http://stanfordnlp.github.io/CoreNLP/corenlp-server.html).

Make sure you modify Moses.config in the moses.sjs file. In the future a config file will be provided, but for now edit it there to
 where your endpoint for Stanford NLP is at.

You will require Java 1.8 JDK to run this. It does not have to be run locally, either. It'll take between 2 to 6gb of ram depending
 on how much text you want to enrich. 

---
##Installation steps

1. Clone the repo
2. Install node v0.10.* or later
3. Install java locally
4. Install ruby locally
5. Install MarkLogic on your server (server does NOT need anything but MarkLogic)
6. From the base directory, run npm install
7. Download http://download.geonames.org/export/dump/allCountries.zip and put it in your /resources folder.
8. Unzip resources.zip & allCountries.zip directly into folder /resources (no sub directories)
9. From node, run convertData.js to generate your data. NOTE: this will take a while
10. Modify deploy/build.properties to match your MarkLogic server IP, port, and admin username/password
11. Run ml dev bootstrap
12. Run ml dev deploy modules -v to deploy modules
13. Run through 'deploying the geospatial data' steps listed below using MLCP
14. MOSES should now be installed!
15. (optional) Open a browser and navigate to: http://yourip:8055/demo
16. (optional) To disable having to login with a user/pass (make public), in the MarkLogic admin (http://yourip:8001) under groups->default->app servers->moses [HTTP] you can turn off login safely by setting "authentication" to "application-level" in the drop-down box. 

There's no danger to your system or the server by setting it this way.

---
##Deploying Geospatial Data

First! Download MLCP from https://developer.marklogic.com/products/mlcp and place it in the root of the moses directory.
You should have it at /path/to/moses/mlcp.

In a terminal/command prompt, navigate to /mlcp/bin and run these commands:

1) This should be fast

mlcp import -host <ip> -port 8042 -username admin -password password -input_file_path path/to/moses/data/country-info -output_uri_replace "path/to/moses/data/,''" -batch_size=100 -thread_count 2 -output_collections country -output_permissions moses-role,read,moses-role,update

2) This should be fast

mlcp import -host <ip> -port 8042 -username admin -password password -input_file_path path/to/moses/data/feature-codes -output_uri_replace "path/to/moses/data/,''" -batch_size=100 -thread_count 2 -output_collections feature-code -output_permissions moses-role,read,moses-role,update

3) This one takes a few minutes

mlcp import -host <ip> -port 8042 -username admin -password password -input_file_path path/to/moses/data/admin-codes -output_uri_replace "path/to/moses/data/,''" -batch_size=100 -thread_count 2 -output_collections admin-code -output_permissions moses-role,read,moses-role,update

4) This will take A WHILE. It can go anywhere from 7-21 hours depending on network/hardware/IO of deployer and server

mlcp import -host <ip> -port 8042 -username admin -password password -input_file_path path/to/moses/data/locations -output_uri_replace "path/to/moses/data/,''" -batch_size=200 -thread_count 24 -transaction_size=20 -output_collections location -output_permissions moses-role,read,moses-role,update

5) This is the word dictionary we use to filter against false positives (note it sits in the resources directly, not data here)

mlcp import -host <ip> -port 8042 -username admin -password password -input_file_path path/to/moses/resources/wordlist.json -output_uri_replace "/path/to/moses/resources/,''" -document_type=JSON -batch_size=10 -thread_count 8 -output_permissions moses-role,read,moses-role,update -transaction_size=10 -output_collections wordlist  -mode local

Note: you can run all these commands in any order, but given the spin up time for the locations, it makes more sense to see if the other data will load first.