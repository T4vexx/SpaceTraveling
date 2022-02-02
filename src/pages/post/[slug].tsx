import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import { FiCalendar,FiUser,FiClock } from "react-icons/fi";

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Comments from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  function averageReadingTime() {
    const totalWords = post.data.content.reduce((accWords, content) => {
      let postHeading = 0;
      let postBody = 0;

      if (content.heading) {
        postHeading = content.heading.trim().split(/\s+/).length;
      }

      if (RichText.asText(content.body)) {
        postBody = RichText.asText(content.body).trim().split(/\s+/).length;
      }

      return accWords + postHeading + postBody;
    }, 0)

    const wordsPerMinute = 200;

    return `${Math.ceil(totalWords / wordsPerMinute)} min`
  }
  
  return (
    <>
      <Head>
        <title>{post.data.title} | Space Traveling</title>
      </Head>

      <img className={styles.banner} src={post.data.banner.url} alt="banner" />
      <div className={styles.container}>

        <div className={styles.title}>{post.data.title}</div>

        <div className={styles.infos}>
          <FiCalendar className={styles.fiIcons} />
          <time>{format(
            new Date(post.first_publication_date),
            "d MMM y",
            {
              locale: ptBR,
            }
            )}
          </time>
          <FiUser className={styles.fiIcons} />
          <span>{post.data.author}</span>
          <FiClock className={styles.fiIcons} />
          <span>{averageReadingTime()}</span>
        </div>
        {post.data.content.map(({heading, body}) => (
          <div className={styles.conteudo} key={heading}>
            <strong>{heading}</strong>
            <div dangerouslySetInnerHTML={{ __html: RichText.asHtml(body) }}/>
          </div>
        ))} 

        <Comments />
      </div> 
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ],{
    fetch: ['posts.title', 'post.subtitle', 'post.author'],
    pageSize: 3,
  });

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});


  return {
    props: {
      post: response,
    },
    revalidate: 60*30, // 24 horas
  }
};
