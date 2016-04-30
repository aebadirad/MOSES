#MOSES 
##(Marklogic Originating Spatial Evaluation Service)

Data is derived from www.geonames.org, modified to fit a NoSQL document format, all else is original work.
Uses the [Roxy framework](https://github.com/marklogic/roxy) and [Marklogic Content Pump](https://developer.marklogic.com/products/mlcp) to deploy.

[Demo is available at http://ebadirad.com:8055](http://ebadirad.com:8055/)

---
##VERSION: 0.1-Alpha

A lot of the code is messy and the built in API is really made just to make the demo work.

Need to do some more code clean up, standardization of conventions (naming and coding!), and improve 
the named entity recognition as well as the 'fuzzy' search.

Use at your own risk. If all you are doing is entity extraction or geopoint resolution, it works 
reasonably well. 

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
##Installation steps

1. Clone the repo
2. Install node v0.10.* or later
3. Install java locally
4. Install ruby locally
5. Install MarkLogic on your server (server does NOT need anything but MarkLogic)
6. From the base directory, run npm install
7. Unzip resources.zip into folder /resources
8. From node, run convertData.js to generate your data. NOTE: this will take a while
9. Modify deploy/build.properties to match your MarkLogic server IP, port, and admin username/password
10. Run ml dev bootstrap
11. Run ml dev deploy modules -v to deploy modules
12. Run through 'deploying the geospatial data' steps listed below using MLCP
13. MOSES should now be installed!
14. (optional) Open a browser and navigate to: http://yourip:8055/demo
15. (optional) To disable having to login with a user/pass (make public), in the MarkLogic admin (http://yourip:8001) under groups->default->app servers->moses [HTTP] you can turn off login safely by setting "authentication" to "application-level" in the drop-down box. 

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


Note: you can run all these commands in any order, but given the spin up time for the locations, it makes more sense to see if the other data will load first.