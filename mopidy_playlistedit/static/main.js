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
    
    $('#playlistTracks').on('click', 'i.deleteItem', function(){
       removeTrack($(this).closest('.list-group-item'))       
    });
    $('#playlists').on('click', 'i.deleteItem', function(){
       removePlaylist($(this).closest('.list-group-item'))       
    });
    $('#playlists').on('click', '.list-group-item', function(){
       const itemElem = $(this).closest('.list-group-item')
       loadPlaylist(spotifyUri(itemElem))
    });
    $('#playlistSave').on('click', function(){
       alert("SAVE ME!")
       loadPlaylist(selectedPlaylist.uri)
    });
    $('#playlistReset').on('click', function(){
       loadPlaylist(selectedPlaylist.uri)
    });
})

function spotifyUri(el) {
    return el.data('spotifyUri')
}

function removeTrack(trackItem) {
    setPlaylistModified(true)
    trackItem.remove();
}

function removePlaylist(playlistItem) {
    const uri = spotifyUri(playlistItem)
    mopidy.playlists.delete({'uri': uri}).then(function (success) {
        resetUI()
    })
    playlistItem.remove();
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
            var listItem = $('<div class="list-group-item list-group-item-action"></div>')
            listItem.data('spotifyUri', p.uri)
            listItem.html(htmlItemWithDelete(p.name))
            listItem.appendTo(listElem)
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
            const track = playlist.tracks[i]
            const content = htmlTrack(track)
            var listItem = $('<div class="list-group-item list-group-item-action"></div>')
            listItem.data('spotifyUri', track.uri)
            listItem.html(htmlItemWithDelete(content))
            listItem.appendTo(listElem)
        }
        $('#playlistTracksWrap').show()
        $('#playlistName').val(playlist.name)
    }, console.error)
}

function htmlItemWithDelete(content) {
    return `<div class="row">
                <div class="col mb-0 item-content">
                    ${ content }
                </div>
                <div class="col-md-auto align-self-center">
                    <i class="fas fa-trash btn btn-sm deleteItem" roll="button"></i>
                </div>
            </div>`
}

function htmlTrack(track) {
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
    const albumTitle = (track.album && track.album.name) ? track.album.name : ''
    return `<h5 class="mb-0">${ artistStr } - ${ track.name }</h5>
            <small>${ albumTitle }</small>`
}
