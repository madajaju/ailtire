FROM ollama/ollama:latest


RUN groupadd -g 1001 ailtireGroup
RUN useradd -u 1001 -g ailtireGroup -m -d /home/ailtireUser ailtireUser

EXPOSE 11434

USER ailtireUser

ENTRYPOINT ["/bin/ollama"]
CMD ["serve"]
