import logging
import pathlib

import pkg_resources

from mopidy import config, ext

__version__ = pkg_resources.get_distribution("Mopidy-PlaylistEdit").version

logger = logging.getLogger(__name__)


class Extension(ext.Extension):

    dist_name = "Mopidy-PlaylistEdit"
    ext_name = "playlistedit"
    version = __version__

    def get_default_config(self):
        return config.read(pathlib.Path(__file__).parent / "ext.conf")

    def get_config_schema(self):
        schema = super().get_config_schema()
        return schema

    def setup(self, registry):
        registry.add(
            "http:static",
            {
                "name": self.ext_name,
                "path": str(pathlib.Path(__file__).parent / "static"),
            },
        )
