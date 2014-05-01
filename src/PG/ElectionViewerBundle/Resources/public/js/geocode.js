function parse_geocode()
{

    $.getJSON( "municipale2014.json",
            function( data ) {
                var items = [];
                $.each( data, function ( key, bureau ) {
                    $.getJSON("http://nominatim.openstreetmap.org/search?street="+ bureau.adresse + "&city=ANTONY& country=FRANCE&postalcode=92160&format=json&polygon=0&limit=1",
                        function (loc_data) {
                            //$("body").append(JSON.stringify(loc_data));
                            bureau.lat = loc_data[0].lat;
                            bureau.lon = loc_data[0].lon;
                            $("body").append(JSON.stringify(bureau) +",");
                        });
                });
            });
}
