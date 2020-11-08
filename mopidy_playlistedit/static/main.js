const OFFLINE_TEST = true
function getMopidy() {
    return OFFLINE_TEST ? MopidyMock() : new Mopidy()
}
var mopidy
var selectedPlaylist = {
    modified: false,
    uri: null,
}

$(document).ready(function (event) {
    mopidy = getMopidy()
    mopidy.on('state:online', function () {
        loadAllPlaylists(OFFLINE_TEST)
    })
    
    Sortable.create(playlistTracks, {
      animation: 100,
      group: 'list-1',
      draggable: '.list-group-item',
      handle: '.list-group-item',
      sort: true,
      filter: '.sortable-disabled',
      chosenClass: 'active'
    });

    resetUI()
    
    $('#playlistTracks').on('click', 'i.deleteTrack', function(){
       removeTrack($(this).closest('.list-group-item'))       
    });
    $('#playlists').on('click', 'i.deletePlaylist', function(){
       removeTrack($(this).closest('.list-group-item'))       
    });
    $('#playlistSave').on('click', function(){
       alert("SAVE ME!")
       loadPlaylist(selectedPlaylist.uri)
    });
    $('#playlistReset').on('click', function(){
       loadPlaylist(selectedPlaylist.uri)
    });
})

function removeTrack(trackElem) {
    setPlaylistModified(true)
    trackElem.remove();
}

function setPlaylistModified(isModified) {
    $('#playlistSave').prop('disabled', !isModified);
    selectedPlaylist.modified = isModified
}
    

function loadAllPlaylists (selectFirst) {
    const listElem = $('#playlists')
    listElem.empty()
    resetUI()
    mopidy.playlists.asList().then(function (plists) {
        for (var i = 0; i < plists.length; i++) {
            const p = plists[i]
            const html = `<div class="list-group-item list-group-item-action no-drag"
                            onclick="loadPlaylist($(this).data('uri'))"
                            data-uri="${ p.uri }">${ p.name }</div>`
            listElem.append(html)
        }
        if (selectFirst) {
            $('#playlists')[0].childNodes[0].click()
        }
    }, console.error)
}

function formatPlaylistItem() {
}

function resetUI() {
    $('#playlistTracks').empty()
    $('#playlistTracksWrap').hide()
    setPlaylistModified(false)
}
   

function refreshPlaylists () {
    resetUI()
    mopidy.playlists.refresh().then(function () {
        loadAllPlaylists()
    }, console.error)
}

function loadPlaylist (uri, customListElem) {
    const listElem = customListElem || $('#playlistTracks')
    resetUI()
    mopidy.playlists.lookup({'uri': uri}).then(function (playlist) {
        setPlaylistModified(false)
        selectedPlaylist.uri = playlist.uri
        for (var i = 0; i < playlist.tracks.length; i++) {
            const track = getTrackDetails(playlist.tracks[i])
            var listItem = $(`<div class="list-group-item list-group-item-action">${ formatTrackItem(track) }</div>`)
            listItem.data('spotifyUri', track.uri)
            listItem.appendTo(listElem)
        }
        $('#playlistTracksWrap').show()
        $('#playlistName').val(playlist.name)
        console.log(`Loaded ${playlist.name} (${uri}) for editing`)
    }, console.error)
}

function formatTrackItem(track) {
    return `<div class="row">
                <div class="col mb-0">
                    <h5 class="mb-0">${ track.artists } - ${ track.title }</h5>
                    <small>${ track.albumTitle }</small>
                </div>
                <div class="col-1 align-self-center">
                    <i class="fas fa-trash btn btn-sm deleteTrack" roll="button"></i>
                </div>
            </div>`
}

function getTrackDetails(track) {
    var artistStr = 'Unknown Artist'
    if (track.artists) {
        artistStr = ''
        for (var i = 0; i < track.artists.length; i++) {
            artistStr += track.artists[i].name
            artistStr += (i === track.artists.length - 1) ? '' : ' / '
            // Stop after 3
            if (i > 2) {
                artistStr += '...'
                break
            }
        }
    }
    return {
        title: track.name,
        artists: artistStr,
        albumTitle: (track.album && track.album.name) ? track.album.name : '',
    }
}
