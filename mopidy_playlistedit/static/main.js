const OFFLINE_TEST = false
function getMopidy() {
    return OFFLINE_TEST ? MopidyMock() : new Mopidy()
}
var mopidy
var selectedPlaylist = {
    modified: false,
    model: null,
}
var searchUriSchemes = []
var playlistUriSchemes = []

$(document).ready(function (event) {
    mopidy = getMopidy()
    mopidy.on('state:online', function () {
        resetUI()
        loadAllPlaylists(OFFLINE_TEST ? 0 : undefined)
        fetchUriSchemes()
    })
    
    Sortable.create(playlistTracks, {
      animation: 100,
      group: 'list-1',
      draggable: '.list-group-item',
      handle: '.list-group-item',
      sort: true,
      chosenClass: 'active',
      onUpdate: function (evt) {
          setPlaylistModified(true)
      },
    });

    resetUI()
    
    $('#playlistTracks').on('click', 'i.deleteItem', function(){
       removeTrack($(this).closest('.list-group-item'))       
    });
    $('#playlists').on('click', 'i.deleteItem', function(){
       deletePlaylist($(this).closest('.list-group-item'))
    });
    $('#playlists').on('click', '.item-content', function(){
       const itemElem = $(this).closest('.list-group-item')
       loadPlaylist(spotifyUri(itemElem))
    });
    $('#playlistSave').on('click', function(){
       savePlaylist(selectedPlaylist.model.uri)
    });
    $('#playlistReset').on('click', function(){
       loadPlaylist(selectedPlaylist.model.uri)
    });
    $('#playlistAdd').on('click', function(){
       addTracks()
    });
    $('#newPlaylistCreate').on('click', function(){
       createPlaylist()
    });
    $('#newPlaylistModal').on('show.bs.modal', function (event) {
        const staticSchemes = []
        populateUriSchemes(playlistUriSchemes, staticSchemes, "#newPlaylistSchemeSelect", "#newPlaylistScheme")
    });
    $('#addTracksModal').on('show.bs.modal', function (event) {
        const staticSchemes = ["Everything!"]
        populateUriSchemes(searchUriSchemes, staticSchemes, "#searchSchemeSelect", "#searchScheme")
    });
})

function fetchUriSchemes() {
    searchUriSchemes = []
    mopidy.getUriSchemes().then(function (schemes) {
        for (var i = 0; i < schemes.length; i++) {
            searchUriSchemes.push(schemes[i].toLowerCase())
        }
    })
    playlistUriSchemes = []
    mopidy.playlists.getUriSchemes().then(function (schemes) {
        for (var i = 0; i < schemes.length; i++) {
            playlistUriSchemes.push(schemes[i].toLowerCase())
        }
    })
}

function makeSelectOption(template, val) {
    var option = $(template)
    option.data('scheme', val)
    option.html(val)
    return option
    option.appendTo(selectElem)
}

function populateUriSchemes(schemes, staticSchemes, selectId, mytargetId, ) {
    const selectElem = $(selectId)
    selectElem.empty()
    
    const itemTemplate = `<a class="dropdown-item" onclick="setUriScheme($(this), '${ mytargetId }')"></a>`
    
    for (var i = 0; i < staticSchemes.length; i++) {
        makeSelectOption(itemTemplate, staticSchemes[i]).appendTo(selectElem)
    }
    if (staticSchemes.length) {
        const divider = $('<div role="separator" class="dropdown-divider"></div>')
        divider.appendTo(selectElem)
    }
    
    for (var i = 0; i < schemes.length; i++) {
        makeSelectOption(itemTemplate, schemes[i]).appendTo(selectElem)
    }
    selectElem.children().eq(0).click()
}

function setUriScheme(selectedElem, targetId) {
    const uriScheme = selectedElem.data('scheme')
    const span = $(targetId)
    span.html(uriScheme)
}
    

function spotifyUri(el) {
    return el.data('spotifyUri')
}

function createPlaylist() {
    const scheme = $("#newPlaylistScheme").val()
    const name = $("#newPlaylistName").val()
    if (name.length == 0) {
        return
    }
    $("#newPlaylistModal").modal('hide')
    $("#newPlaylistName").val("")

    mopidy.playlists.create({'name': name, 'uri_scheme': scheme}).then(function (newPlaylist) {
        if (newPlaylist) {
            loadAllPlaylists()
            loadPlaylist(newPlaylist).then(function () {
                $('#addTracksModal').modal('show')
            })
        }
    }, console.error)
}

function removeTrack(trackItem) {
    setPlaylistModified(true)
    trackItem.remove();
}

function deletePlaylist(playlistItem) {
    const uri = spotifyUri(playlistItem)
    mopidy.playlists.delete({'uri': uri}).then(function (success) {
    })
    playlistItem.remove();
    if (uri === selectedPlaylist.model.uri) {
        resetUI()
    }
}

function savePlaylist(uri) {
    console.assert(uri == selectedPlaylist.model.uri, "uri mismatch when saving")
    if (!selectedPlaylist.modified) {
        alert("Playlist was not modified")
        return
    }

    const mopidyPlaylist = { ...selectedPlaylist.model}
    mopidyPlaylist.tracks = []
    $('#playlistTracks .list-group-item').each(function() {
        const track = $(this).data('mopidyTrack')
        mopidyPlaylist.tracks.push(track)
    })
    mopidyPlaylist.name = $('#playlistName').val()

    mopidy.playlists.save({'playlist': mopidyPlaylist}).then(function (savedPlaylist) {
        loadPlaylist(savedPlaylist)
        alert("Saved")
    })
}

function setPlaylistModified(isModified) {
    $('#playlistSave').prop('disabled', !isModified);
    selectedPlaylist.modified = isModified
}

function setSelectedPlaylist(mopidyPlaylist) {
    setPlaylistModified(false)
    selectedPlaylist.model = { ...mopidyPlaylist }; // Taking a copy.
    if (typeof mopidyPlaylist !== 'undefined') {
        selectedPlaylist.model.tracks = []
    }
}

function loadAllPlaylists (selectIndex) {
    const listElem = $('#playlists')
    listElem.empty()
    mopidy.playlists.asList().then(function (plists) {
        for (var i = 0; i < plists.length; i++) {
            const p = plists[i]
            var listItem = $('<div class="list-group-item list-group-item-action"></div>')
            listItem.data('spotifyUri', p.uri)
            listItem.html(htmlItemWithDelete(p.name))
            listItem.appendTo(listElem)
        }
        if (typeof(selectIndex) === "number") {
            $('#playlists .list-group-item').eq(selectIndex).find('.item-content').click()
        }
    }, console.error)
}

function resetUI() {
    $('#playlistTracksWrap').hide()
    $('#playlistTracks').empty()
    setSelectedPlaylist()
}

function refreshPlaylists () {
    resetUI()
    loadAllPlaylists()
}

function loadPlaylist (uri_or_playlist) {
    resetUI()

    var promise
    if (typeof(uri_or_playlist) === "object") {
        promise = Promise.resolve(uri_or_playlist)
    } else {
        promise = mopidy.playlists.lookup({'uri': uri_or_playlist})
    }
    return promise.then(function (playlist) {
        const listElem = $('#playlistTracks')
        for (var i = 0; playlist.tracks && i < playlist.tracks.length; i++) {
            const track = playlist.tracks[i]
            var listItem = $('<div class="list-group-item list-group-item-action"></div>')
            listItem.data('mopidyTrack', track)
            const wtf = listItem.data('mopidyTrack')
            listItem.html(htmlItemWithDelete(htmlTrack(track)))
            listItem.appendTo(listElem)
        }
        setSelectedPlaylist(playlist)
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
