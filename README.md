MOSES (Marklogic Originating Spatial Evaluation Service)

Data is derived from www.geonames.org, modified to fit a NoSQL document format, all else is original work.


====
REQUIRED HARDWARE

A production version of this will not be insignificant in terms of hardware.

The design is heavily weighted to use disk space to optimize on ram and cpu, so use SDDs if possible.

For development you'll want around 2 cpus and 8 gigs of ram. You can get away with less, but initial 
ingestion of the data will be pretty miserable if you do. Operationally, you could squeak by with 
1 cpu and 2gb if you absolutely had to and wanted to do ingestion in batches or only use a few countries
 worth of data.

For light production you'll want at least 4 cores, 8 gigs of ram.

For anything that gets over a few thousand hits an hour, you'll need at least a 4-6 core with 16 gigs of ram.

For public services, you'll want a 12+ core, 32 gig ram setup. You should be able to serve millions of requests an hour.

====

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

====
Deploying Geospatial Data

Navigate to /mlcp/bin and run these commands:

mlcp import -host <ip> -port 8042 -username admin -password password -input_file_path path/to/moses/data/country-info -output_uri_replace "path/to/moses/data/,''" -batch_size=100 -thread_count 2 -output_collections country -output_permissions moses-role,read,moses-role,update

mlcp import -host <ip> -port 8042 -username admin -password password -input_file_path path/to/moses/data/feature-codes -output_uri_replace "path/to/moses/data/,''" -batch_size=100 -thread_count 2 -output_collections feature-code -output_permissions moses-role,read,moses-role,update

mlcp import -host <ip> -port 8042 -username admin -password password -input_file_path path/to/moses/data/admin-codes -output_uri_replace "path/to/moses/data/,''" -batch_size=100 -thread_count 2 -output_collections admin-code -output_permissions moses-role,read,moses-role,update

mlcp import -host <ip> -port 8042 -username admin -password password -input_file_path path/to/moses/data/locations -output_uri_replace "path/to/moses/data/,''" -batch_size=150 -thread_count 12 -output_collections location -output_permissions moses-role,read,moses-role,update


Note: you can run all these commands as a single one, but given the spin up time for the locations, it makes more sense to see if the other data will load first.