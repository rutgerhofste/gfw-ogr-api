FROM rrequero/gdal
MAINTAINER raul.requero@vizzuality.com

USER root
# Install node
RUN sudo add-apt-repository ppa:fkrull/deadsnakes
RUN sudo apt-get update
RUN sudo apt-get -y install curl python2.7
RUN curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
RUN sudo apt-get install -y nodejs build-essential
# end install node
RUN npm install -g grunt-cli bunyan
ENV NAME gfw-ogr-api
ENV USER microservice

RUN groupadd -r $USER && useradd -r -g $USER $USER

RUN mkdir -p /opt/$NAME
ADD package.json /opt/$NAME/package.json
 RUN cd /opt/$NAME && npm install

COPY entrypoint.sh /opt/$NAME/entrypoint.sh
COPY config /opt/$NAME/config

WORKDIR /opt/$NAME

ADD ./app /opt/$NAME/app

# Tell Docker we are going to use this ports
EXPOSE 3200 35729
USER $USER

ENTRYPOINT ["./entrypoint.sh"]
