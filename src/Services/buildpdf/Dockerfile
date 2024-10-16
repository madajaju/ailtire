FROM pandoc/extra

WORKDIR /docs

# Copy local files to the Docker container
COPY . .

# Default command for converting Markdown to PDF
ENTRYPOINT ["sh", "-c", "cd /docs && pandoc $0 -o $1 --pdf-engine=xelatex --template=/docs/eisvogel.latex --listings" ]
