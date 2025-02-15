FROM pandoc/extra

WORKDIR /docs

RUN addgroup -g 1001 ailtireGroup && \
    adduser -u 1001 -G ailtireGroup -h /home/ailtireUser -D ailtireUser


# Copy local files to the Docker container
COPY . .

RUN chown -R ailtireUser:ailtireGroup /docs

USER ailtireUser

# Default command for converting Markdown to PDF
ENTRYPOINT ["sh", "-c", "cd /docs && pandoc $0 -o $1 --pdf-engine=xelatex --template=/docs/eisvogel.latex --listings" ]
