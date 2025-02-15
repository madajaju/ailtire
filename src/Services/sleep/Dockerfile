FROM alpine:latest

# Create a non-root user and group using Alpine commands
RUN addgroup -g 1001 ailtiregroup && \
    adduser -u 1001 -G ailtiregroup -h /home/ailtireUser -D ailtireUser

# Create app directory and set it as the working directory
WORKDIR /usr/src/app
COPY . .

# Ensure necessary permissions for the non-root user
RUN chown -R ailtireUser:ailtiregroup /usr/src/app

# Run everything as the non-root user
USER ailtireUser

# Specify the default command
CMD [ "./runme.sh" ]