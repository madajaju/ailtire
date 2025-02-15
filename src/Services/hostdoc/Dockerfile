FROM jekyll/jekyll

RUN addgroup -g 1001 ailtireGroup
RUN adduser -u 1001 -G ailtireGroup -h /home/ailtireUser -D ailtireUser

# Create app directory
COPY . .
# Install app dependencies

USER ailtireUser

EXPOSE 4000
CMD [ "bundle", "install" ]