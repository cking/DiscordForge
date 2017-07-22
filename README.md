<p align="center">
	<a href="https://discordforge.me"><img alt="DiscordForge Banner" src="https://github.com/DiscordForge/DiscordForge/raw/master/discordforge.png"></img></a>
	<br>
	<br>
	<a href="https://www.codacy.com/app/LewisTehMinerz/DiscordForge?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=DiscordForge/DiscordForge&amp;utm_campaign=Badge_Grade"><img src="https://api.codacy.com/project/badge/Grade/40a38e8e01834cd29e03bd89a30f6d2e"/></a>
</p>

# What is it?
DiscordForge is an unofficial plugin API for Discord. It allows people to write their own plugins and let people download them easily through the command line.

# How does it work?
When you install DiscordForge into your client, there is a bootstrapper that loads the actual DiscordForge modloader into Discord. This means that instead of reinstalling the modloader every time there is an update, you can just update it and restart Discord. It's that simple to update DiscordForge.

# How can I get it?
Currently, DiscordForge is in a non-usable state. When it comes out, this line will be removed.

Here are the steps to install DiscordForge:
* Get [git](https://git-scm.com/)
* Get [node](https://nodejs.org/)
* Clone the repository by running `git clone https://github.com/DiscordForge/DiscordForge`
* Run `node setup`

If you want to inject DiscordForge into your client from the get-go, run `discordforge inject`.

# How do I create a plugin?
Please refer to our ["Creating a Plugin" wiki page](https://github.com/DiscordForge/DiscordForge/wiki/Creating-a-Plugin) for a guide on how to set up a repository and create a plugin.

Anything else you need to know about DiscordForge is located at the [wiki](https://github.com/DiscordForge/DiscordForge/wiki). The wiki also contains more information.
